import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useEffect, useReducer, useRef, useState } from "react";
import { AppBar, Box, Tabs, Tab, IconButton } from "@mui/material";
import type { SceneInteractor } from "./components/uiComponents/3D/sceneInteractor";
import * as THREE from "three";

import Home from "./components/pages/homePage/Home";
import Scene3D from "./components/pages/scene3D/Scene3D";

export type ProjectItem = {
  type: string;
  id: string;
  isOpened: boolean;
  current: boolean;
};

export type ProjectsAction =
  | { type: "addProject"; item: ProjectItem }
  | { type: "removeProject"; id: string }
  | { type: "updateProject"; id: string; updates: Partial<ProjectItem> }
  | { type: "setCurrentProject"; id: string };

export type ProjectRuntime = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
};

function App() {
  // Initialize main renderer
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Change the part of projects after backend connection
  const projectsReducer = (
    state: ProjectItem[],
    action: ProjectsAction,
  ): ProjectItem[] => {
    switch (action.type) {
      case "addProject":
        return [...state.map((p) => ({ ...p, current: false })), action.item];
      case "removeProject":
        return state.filter((p) => p.id !== action.id);
      case "setCurrentProject":
        return state.map((p) =>
          p.id === action.id
            ? { ...p, isOpened: true, current: true }
            : { ...p, current: false },
        );
      case "updateProject":
        return state.map((p) =>
          p.id === action.id ? { ...p, ...action.updates } : p,
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

  const objModulesURL = import.meta.glob("/src/assets/templates/**/*.obj", {
    query: "?url",
    import: "default",
    eager: true,
  });

  const projectsRuntimeRef = useRef<Record<string, SceneInteractor>>({});
  const activeProjectRef = useRef<SceneInteractor | null>(null);
  const objModulesRef = useRef<Record<string, string>>({});
  const objCacheRef = useRef<Map<string, THREE.Group>>(new Map());

  Object.entries(objModulesURL).forEach(([path, value]) => {
    const name = path.split("/").pop()?.replace(".obj", "") || "undefined";
    objModulesRef.current[name] = value as string;
  });

  const [activeTab, setActiveTab] = useState<string>("home");
  const [sceneVersion, setSceneVersion] = useState(0);
  const notifySceneChanged = () => {
    setSceneVersion((v) => v + 1);
  };

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/home") {
      setActiveTab("home");
      return;
    }

    if (location.pathname.startsWith("/scene3D/")) {
      const id = location.pathname.split("/").pop();
      if (id) {
        setActiveTab(id);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeTab === "home") {
      activeProjectRef.current = null;
      return;
    }

    const runtime = projectsRuntimeRef.current[activeTab];
    if (runtime) {
      activeProjectRef.current = runtime;
    }
    notifySceneChanged();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        const canvas = rendererRef.current.domElement;
        canvas.parentElement?.removeChild(canvas);
        rendererRef.current = null;
      }
    };
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, tabId: string) => {
    if (tabId === "home") {
      navigate("/home");
      return;
    }

    dispatchProjects({ type: "setCurrentProject", id: tabId });
    navigate(`/scene3D/${tabId}`);
    // notifySceneChanged();
  };

  const handleCloseTab = (tabId: string) => {
    // dispose runtime
    const runtime = projectsRuntimeRef.current[tabId];
    if (runtime) {
      runtime.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if ((mesh as any).material) {
          const m = (mesh as any).material;
          Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose();
        }
      });
      delete projectsRuntimeRef.current[tabId];
    }

    dispatchProjects({
      type: "updateProject",
      id: tabId,
      updates: { isOpened: false, current: false },
    });

    if (activeTab === tabId) {
      navigate("/home");
      setActiveTab("home");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper" }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="home" label="Home" disabled={activeTab === "home"} />

          {projects
            .filter((p) => p.isOpened)
            .map((p) => (
              <Tab
                key={p.id}
                value={p.id}
                disabled={activeTab === p.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{`Scene ${p.id.slice(0, 4)}`}</span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(p.id);
                      }}
                    >
                      ✕
                    </IconButton>
                  </Box>
                }
              />
            ))}
        </Tabs>
      </AppBar>

      <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <Home
                projects={projects}
                dispatchProjects={dispatchProjects}
                projectsRuntimeRef={projectsRuntimeRef}
              />
            }
          />

          <Route
            path="/scene3D/:sceneId"
            element={
              <Scene3D
                rendererRef={rendererRef}
                activeProjectRef={activeProjectRef}
                objModulesRef={objModulesRef}
                objCacheRef={objCacheRef}
                sceneVersion={sceneVersion}
                notifySceneChanged={notifySceneChanged}
              />
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
