import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { ProjectItem, ProjectsAction } from "../../../App.tsx";
import type { Dispatch } from "react";

function getScenePreview(sceneId: string): string | null {
  return localStorage.getItem(`scene-preview:${sceneId}`);
}

interface Props {
  projects: ProjectItem[];
  dispatchProjects: Dispatch<ProjectsAction>;
}

function Scenes(props: Props) {
  const { projects, dispatchProjects } = props;
  const navigate = useNavigate();

  const handleClick = (tab: ProjectItem) => {
    dispatchProjects({
      type: "updateProject",
      id: tab.id,
      updates: { isOpened: true },
    });
    navigate(`/scene3D/${tab.id}`);
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
          const preview = getScenePreview(tab.id);
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
                }}
                onClick={() => handleClick(tab)}
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
                  <Typography>Scene {tab.id.slice(0, 4)}</Typography>
                )}
              </CardActionArea>
            </Card>
          );
        })}
    </Box>
  );
}

export default Scenes;
