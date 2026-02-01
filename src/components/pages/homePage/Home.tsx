import { useNavigate } from "react-router-dom";
import { Box, SpeedDial, SpeedDialAction } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import { v4 as uuid } from "uuid";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  ProjectsAction,
  ProjectItem,
  ProjectRuntime,
} from "../../../App.tsx";
import Projects from "./Projects.tsx";
import { createScene } from "../../components/3D/scene.ts";

interface Props {
  projects: ProjectItem[];
  dispatchProjects: Dispatch<ProjectsAction>;
  projectsRuntimeRef: RefObject<Record<string, ProjectRuntime>>;
}

function Home(props: Props) {
  const { projects, dispatchProjects, projectsRuntimeRef } = props;
  const navigate = useNavigate();

  const actions = [
    {
      icon: <AddIcon />,
      name: "Add new project",
      onClick: () => {
        const id = uuid();
        dispatchProjects({
          type: "addProject",
          item: { type: "scene", id, isOpened: true, current: true },
        });
        navigate(`/scene3D/${id}`);
        projectsRuntimeRef.current[id] = createScene();
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
      <Projects
        projects={projects}
        dispatchProjects={dispatchProjects}
        projectsRuntimeRef={projectsRuntimeRef}
      ></Projects>
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
