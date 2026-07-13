import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

class ProjectController {
  async createProject(req, res) {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Project name is required" });
    }

    const projectId = uuidv4();
    let client;

    try {
      client = await db.connect();
      await client.query("BEGIN");
      await client.query(
        `
      INSERT INTO projects (id, name)
      VALUES ($1, $2)
      `,
        [projectId, name],
      );

      await client.query(
        `
      INSERT INTO cameras (
        project_id,
        type,
        pos_x, pos_y, pos_z,
        target_x, target_y, target_z,
        fov,
        zoom
      )
      VALUES (
        $1,
        'perspective',
        20, 20, 20,
        0, 0, 0,
        60,
        1
      )
      `,
        [projectId],
      );

      await client.query("COMMIT");

      return res.status(201).json({
        id: projectId,
        name,
      });
    } catch (err) {
      if (client) await client.query("ROLLBACK");
      console.error("createProject error:", err);
      return res.status(500).json({ error: "Failed to create project" });
    } finally {
      client?.release();
    }
  }

  async getOneSaving(req, res) {
    res.status(501).json({ error: "getOneSaving is not implemented yet" });
  }

  async getLatestSaving(req, res) {
    try {
      const result = await db.query(`
        SELECT
          s.cubeid,
          EXTRACT(EPOCH FROM s.duration)::INT AS duration,
          s.created_at,
          cm.x, cm.y, cm.z,
          cm.rotx, cm.roty, cm.rotz
        FROM savings s
        JOIN cubesmodifications cm
          ON s.cubeid = cm.cubeid
        WHERE s.cubeid = (
          SELECT cubeid
          FROM savings
          ORDER BY created_at DESC
          LIMIT 1
        )
        ORDER BY cm.id;
      `);
      res.json({
        cubeid: result.rows[0]?.cubeid,
        duration: result.rows[0]?.duration,
        created_at: result.rows[0]?.created_at,
        cubes: result.rows.map((r) => ({
          x: r.x,
          y: r.y,
          z: r.z,
          rotX: r.rotx,
          rotY: r.roty,
          rotZ: r.rotz,
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "DB error" });
    }
  }

  async getAllProjects(req, res) {
    try {
      const projects = await db.query("SELECT * FROM projects");
      res.json(projects.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "DB error" });
    }
  }

  async updateSaving(req, res) {
    res.status(501).json({ error: "updateSaving is not implemented yet" });
  }

  async deleteSaving(req, res) {
    const { id } = req.body;

    if (!id || typeof id !== "string") {
      return res
        .status(400)
        .json({ error: "Project id is not provided to delete" });
    }
    try {
      await db.query("DELETE FROM projects WHERE id=$1", [id]);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "DB error" });
    }
  }
}

export default ProjectController;
