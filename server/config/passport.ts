import passport from "passport";
import { Strategy as GitHubStrategy, type Profile } from "passport-github2";
import pool from "./dbConfig";
import { decrypt } from "../utils/encryption";
import type { Request } from "express";

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback",
            scope: ["user:email", "read:org"],
            passReqToCallback: true,
        },
        async (req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const orgResult = await pool.query(
                    "SELECT id, github_org_slug, github_access_token, join_code FROM orgs WHERE is_configured = true LIMIT 1"
                );

                if (orgResult.rows.length === 0) {
                    return done(null, false, { message: "Organization not configured" });
                }

                const org = orgResult.rows[0];

                const joinCodeFromCookie = req.cookies?.kachow_join_code;
                let hasValidJoinCode = false;

                if (joinCodeFromCookie && org.join_code) {
                    hasValidJoinCode = joinCodeFromCookie.toUpperCase().trim() === org.join_code.toUpperCase().trim();
                }

                const existingUserCheck = await pool.query(
                    "SELECT id FROM users WHERE github_id = $1 AND org_id = $2",
                    [String(profile.id), org.id]
                );
                const isReturningUser = existingUserCheck.rows.length > 0;

                if (!hasValidJoinCode && !isReturningUser) {
                    if (!org.github_access_token) {
                        return done(null, false, { message: "not_org_member" });
                    }
                    const orgToken = decrypt(org.github_access_token);
                    const memberCheckRes = await fetch(
                        `https://api.github.com/repos/${org.github_org_slug}/collaborators/${profile.username}`,
                        {
                            headers: {
                                Authorization: `Bearer ${orgToken}`,
                                Accept: "application/vnd.github.v3+json",
                                "User-Agent": "KA-CHOW",
                            },
                        }
                    );

                    if (memberCheckRes.status !== 204) {
                        return done(null, false, {
                            message: `not_org_member`,
                        });
                    }
                }

                const existingUser = await pool.query(
                    "SELECT * FROM users WHERE github_id = $1",
                    [String(profile.id)]
                );

                const email = profile.emails?.[0]?.value;
                const avatarUrl = profile.photos?.[0]?.value;

                if (existingUser.rows.length > 0) {
                    const user = existingUser.rows[0];

                    if (!user.is_active) {
                        return done(null, false, { message: "account_deactivated" });
                    }

                    const updated = await pool.query(
                        `UPDATE users SET
                            github_username = $1,
                            github_avatar_url = $2,
                            avatar = $2,
                            last_login_at = CURRENT_TIMESTAMP,
                            last_seen_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                         WHERE github_id = $3
                         RETURNING *`,
                        [profile.username, avatarUrl, String(profile.id)]
                    );
                    return done(null, updated.rows[0]);
                }

                if (email) {
                    const emailUser = await pool.query(
                        "SELECT * FROM users WHERE email = $1",
                        [email]
                    );

                    if (emailUser.rows.length > 0) {
                        const updated = await pool.query(
                            `UPDATE users SET
                                github_id = $1, github_username = $2, github_avatar_url = $3,
                                avatar = $3, org_id = $4,
                                last_login_at = CURRENT_TIMESTAMP,
                                last_seen_at = CURRENT_TIMESTAMP,
                                updated_at = CURRENT_TIMESTAMP
                             WHERE email = $5
                             RETURNING *`,
                            [String(profile.id), profile.username, avatarUrl, org.id, email]
                        );
                        return done(null, updated.rows[0]);
                    }
                }

                const newUser = await pool.query(
                    `INSERT INTO users (
                        username, email, github_id, github_username, github_avatar_url,
                        avatar, auth_provider, kachow_role, org_id, is_active,
                        first_login_at, last_login_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'github', 'engineer', $7, true,
                              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                     RETURNING *`,
                    [
                        profile.displayName || profile.username,
                        email,
                        String(profile.id),
                        profile.username,
                        avatarUrl,
                        avatarUrl,
                        org.id,
                    ]
                );

                return done(null, newUser.rows[0]);
            } catch (err) {
                console.error("Error in GitHub Strategy:", err);
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
