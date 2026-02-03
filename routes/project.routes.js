import { Router } from "express";
import ProjectController from "../controller/project.controller.js";

const projectRouter = new Router();
const controller = new ProjectController();

projectRouter.post("/", controller.createSaving);
projectRouter.get("/latest", controller.getLatestSaving);
projectRouter.get("/:cubeid", controller.getOneSaving);
projectRouter.get("/", controller.getAllSavings);
projectRouter.put("/", controller.updateSaving);
projectRouter.delete("/", controller.deleteSaving);

export default projectRouter;
