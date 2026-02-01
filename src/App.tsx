import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./components/pages/homePage/Home";
import Scene3D from "./components/pages/scene3D/Scene3D";
import { useState, useEffect, useReducer } from "react";
import { AppBar, Box, Tabs, Tab, IconButton } from "@mui/material";

export type ProjectItem = { type: string; id: string; isOpened: boolean };
export type ProjectsAction =
  | { type: "addProject"; item: ProjectItem }
  | { type: "removeProject"; id: string }
  | { type: "updateProject"; id: string; updates: Partial<ProjectItem> };

function App() {
  // Change the part of projects after backend connection
  const projectsReducer = (
    state: ProjectItem[],
    action: ProjectsAction,
  ): ProjectItem[] => {
    switch (action.type) {
      case "addProject":
        return [...state, action.item];
      case "removeProject":
        return state.filter((project) => project.id !== action.id);
      case "updateProject":
        return state.map((project) =>
          project.id === action.id
            ? { ...project, ...action.updates }
            : project,
        );
      default:
        return state;
    }
  };
  const initProjects = (): ProjectItem[] => {
    const saved = localStorage.getItem("projects");
    return saved ? JSON.parse(saved) : [];
  };
  const [projects, dispatchProjects] = useReducer(
    projectsReducer,
    [],
    initProjects,
  );

  const [activeTab, setActiveTab] = useState<string>("home");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("home");
    } else if (location.pathname.startsWith("/scene3D/")) {
      const id = location.pathname.split("/").pop();
      if (id) setActiveTab(id);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  const handleChange = (_: React.SyntheticEvent, value: string) => {
    if (value === "home") {
      navigate("/");
    } else {
      navigate(`/scene3D/${value}`);
    }
  };

  const closeTab = (tabId: string) => {
    dispatchProjects({
      type: "updateProject",
      id: tabId,
      updates: { isOpened: false },
    });
    if (activeTab === tabId) {
      navigate("/");
      setActiveTab("home");
    }
    // localStorage.removeItem(`scene-preview:${tabId}`);
    // localStorage.removeItem(`scene:${tabId}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper" }}
      >
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            key="home"
            label="Home"
            value="home"
            disabled={activeTab === "home"}
          />
          {projects
            .filter((project) => project.isOpened)
            .map((project) => (
              <Tab
                key={project.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{`Scene ${project.id.slice(0, 4)}`}</span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(project.id);
                      }}
                    >
                      ✕
                    </IconButton>
                  </Box>
                }
                value={project.id}
                disabled={activeTab === project.id}
              />
            ))}
        </Tabs>
      </AppBar>
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Home projects={projects} dispatchProjects={dispatchProjects} />
            }
          />
          <Route
            path="/scene3D/:sceneId"
            element={<Scene3D activeTab={activeTab} />}
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
