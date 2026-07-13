import { Router } from "express";
import ProjectController from "../controller/project.controller.js";

const projectRouter = Router();
const controller = new ProjectController();

projectRouter.post("/", controller.createProject);
projectRouter.get("/latest", controller.getLatestSaving);
projectRouter.get("/:cubeid", controller.getOneSaving);
projectRouter.get("/", controller.getAllProjects);
projectRouter.put("/", controller.updateSaving);
projectRouter.delete("/", controller.deleteSaving);

export default projectRouter;
