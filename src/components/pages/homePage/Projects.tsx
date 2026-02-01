import { Box, Card, CardActionArea, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { clearScene } from "../../components/3D/scene.ts";
import type * as THREE from "three";

import type {
  ProjectItem,
  ProjectRuntime,
  ProjectsAction,
} from "../../../App.tsx";
import type { Dispatch, RefObject } from "react";
import DeleteIcon from "@mui/icons-material/Delete";

function getProjectPreview(sceneId: string): string | null {
  return localStorage.getItem(`scene-preview:${sceneId}`);
}

interface Props {
  projects: ProjectItem[];
  dispatchProjects: Dispatch<ProjectsAction>;
  projectsRuntimeRef: RefObject<Record<string, ProjectRuntime>>;
}

function Projects(props: Props) {
  const { projects, dispatchProjects, projectsRuntimeRef } = props;
  const navigate = useNavigate();

  const handleCardClick = (tab: ProjectItem) => {
    dispatchProjects({
      type: "setCurrentProject",
      id: tab.id,
    });
    navigate(`/scene3D/${tab.id}`);
  };

  const handleDeleteButtonClick = (tab: ProjectItem) => {
    if (projectsRuntimeRef.current[tab.id]?.scene) {
      clearScene(projectsRuntimeRef.current[tab.id].scene as THREE.Scene);
    }
    dispatchProjects({
      type: "removeProject",
      id: tab.id,
    });
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 2,
        padding: 2,
      }}
    >
      {projects
        .filter((t) => t.type === "scene")
        .map((tab) => {
          const preview = getProjectPreview(tab.id);
          return (
            <Card
              key={tab.id}
              sx={{
                aspectRatio: "1 / 1",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
                onClick={() => handleCardClick(tab)}
              >
                {preview ? (
                  <img
                    src={preview}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Typography>Project {tab.id.slice(0, 4)}</Typography>
                )}
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteButtonClick(tab);
                  }}
                >
                  Delete project
                </Button>
              </CardActionArea>
            </Card>
          );
        })}
    </Box>
  );
}

export default Projects;
