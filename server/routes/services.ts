import { Router, type Request, type Response } from "express";
import pool from "../config/dbConfig";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

function isValidGitUrl(url: string): boolean {
  const gitUrlPattern = /^(https?:\/\/)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w-]+\/[\w.-]+/;
  return gitUrlPattern.test(url);
}

function isValidSubdomain(subdomain: string): boolean {
  const subdomainPattern = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return subdomainPattern.test(subdomain);
}

router.post("/create_service",authMiddleware, async(req:Request, res:Response)=>{
    
    try{
        const { name, repo_url, runtime, branch, root_directory,subdomain } = req.body;
        let { build_cmd, start_cmd } = req.body;
        const user_id = req.user?.id;

        if (!name || !repo_url || !runtime || !subdomain) {
        return res.status(400).json({
          message: "name, repo_url and runtime and subdomain are required",
        });
      }

      if (!isValidGitUrl(repo_url)) {
        return res.status(400).json({
          message: "Invalid Git URL",
        });
      }

      if (!isValidSubdomain(subdomain)) {
        return res.status(400).json({
          message: "Invalid subdomain. Must be 3-63 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens",
        });
      }
      const existing = await pool.query(
        "SELECT id FROM services WHERE subdomain = $1",
        [subdomain]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          message: "Subdomain already taken. Please choose another.",
        });
      }

      const validRuntimes = ["node", "python", "go", "static"];

      if (!validRuntimes.includes(runtime)) {
        return res.status(400).json({
          message: `Invalid runtime. Must be one of: ${validRuntimes.join(", ")}`,
        });
      }

      if (!build_cmd) {
        if (runtime === "python") build_cmd = "pip install -r requirements.txt";
        else if (runtime === "node") build_cmd = "npm install && npm run build";
        else if (runtime === "go") build_cmd = "go build -o app .";
        else if (runtime === "static") build_cmd = "npm run build";
      }

      if (!start_cmd) {
        if (runtime === "python") start_cmd = "python app.py";
        else if (runtime === "node") start_cmd = "npm start";
        else if (runtime === "go") start_cmd = "./app";
        else if (runtime === "static") start_cmd = "";
      }

      if (!build_cmd && !start_cmd && runtime !== "static") {
        return res.status(400).json({
          message: "build_cmd and start_cmd are required",
        });
      }

        const result = await pool.query(
            `INSERT INTO services(user_id,name,repo_url,build_cmd,start_cmd,runtime,branch,root_directory,subdomain)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
            `,
            [user_id,name,repo_url,build_cmd,start_cmd,runtime,branch,root_directory,subdomain]
        )
        const service = result.rows[0];
        res.status(201).json({
          message: "Service created successfully",
          service: {
            ...service,
            status: "created", 
            deploy_url: null,  
          },
        });
    }
    catch(error){
        console.error("Service creation error:", error);
        res.status(500).json({ message: "Server error" });
    }
})          
