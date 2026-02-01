import { useNavigate } from "react-router-dom";
import { Box, SpeedDial, SpeedDialAction } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { v4 as uuid } from "uuid";
import type { Dispatch, SetStateAction } from "react";
import type { ProjectsAction, ProjectItem } from "../../../App.tsx";
import Scenes from "./Scenes.tsx";

interface Props {
  projects: ProjectItem[];
  dispatchProjects: Dispatch<ProjectsAction>;
}

function Home(props: Props) {
  const { projects, dispatchProjects } = props;
  const navigate = useNavigate();

  const actions = [
    {
      icon: <AddIcon />,
      name: "Add new project",
      onClick: () => {
        const id = uuid();
        dispatchProjects({
          type: "addProject",
          item: { type: "scene", id, isOpened: true },
        });
        navigate(`/scene3D/${id}`);
      },
    },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <Scenes projects={projects} dispatchProjects={dispatchProjects}></Scenes>
      <SpeedDial
        ariaLabel="Main SpeedDial"
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 10,
        }}
        icon={<SpeedDialIcon />}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={action.onClick}
            slotProps={{
              tooltip: {
                title: action.name,
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}

export default Home;
