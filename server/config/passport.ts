import passport from "passport";
import { Strategy as GitHubStrategy, type Profile } from "passport-github2";
import pool from "./dbConfig";

const GITHUB_PLACEHOLDER_PASSWORD = "github_oauth_user_no_password_set";  

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        "http://localhost:3000/api/auth/github/callback",
      scope: ["user:email", "repo"], 
    },
    async (
      accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const githubUserId = String(profile.id);
        const githubUsername = profile.username ?? `gh_${githubUserId}`;
        const email = profile.emails?.[0]?.value ?? null;

        const existingResult = await pool.query(
          "SELECT * FROM users WHERE github_user_id = $1",
          [githubUserId]
        );

        if (existingResult.rows.length > 0) {
          const updated = await pool.query(
            `UPDATE users
             SET github_access_token = $1,
                 github_username = $2,
                 updated_at = NOW()
             WHERE github_user_id = $3
             RETURNING id, username, email, github_username, github_user_id, created_at`,
            [accessToken, githubUsername, githubUserId]
          );
          return done(null, updated.rows[0]);
        }

        if (email) {
          const emailResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          if (emailResult.rows.length > 0) {
            const linked = await pool.query(
              `UPDATE users
               SET github_user_id = $1,
                   github_username = $2,
                   github_access_token = $3,
                   updated_at = NOW()
               WHERE email = $4
               RETURNING id, username, email, github_username, github_user_id, created_at`,
              [githubUserId, githubUsername, accessToken, email]
            );
            return done(null, linked.rows[0]);
          }
        }

        let username = (githubUsername)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 30);

        const usernameTaken = await pool.query(
          "SELECT id FROM users WHERE username = $1",
          [username]
        );
        if (usernameTaken.rows.length > 0) {
          username = (username.slice(0, 24) + "_" + githubUserId.slice(-5));
        }

        if (!email) {
          return done(null, false);
        }

        const newUser = await pool.query(
          `INSERT INTO users (username, email, password, github_user_id, github_username, github_access_token)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, username, email, github_username, github_user_id, created_at`,
          [
            username,
            email,
            GITHUB_PLACEHOLDER_PASSWORD,
            githubUserId,
            githubUsername,
            accessToken,
          ]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error("GitHub OAuth error:", err);
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
    const result = await pool.query(
      "SELECT id, username, email, github_username, github_user_id, created_at FROM users WHERE id = $1",
      [id]
    );
    done(null, result.rows[0] ?? null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
