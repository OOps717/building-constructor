import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { SpeedDial, SpeedDialAction } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { RefObject } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import MenuIcon from "@mui/icons-material/Menu";
import type { SceneInteractor } from "../../uiComponents/3D/sceneInteractor";

function saveArrayBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  URL.revokeObjectURL(link.href);
}

function exportSceneGLB(scene: THREE.Scene) {
  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    (result) => {
      if (result instanceof ArrayBuffer) {
        saveArrayBuffer(result, "scene.glb");
      }
    },
    (error) => console.error(error),
    {
      binary: true, // ← ВАЖНО
    },
  );
}

interface Props {
  activeProjectRef: RefObject<SceneInteractor | null>;
  toggleDrawer: (newOpen: boolean) => void;
}

function Scene3DButtons(props: Props) {
  const { activeProjectRef, toggleDrawer } = props;
  const navigate = useNavigate();

  const actions = [
    {
      icon: <ArrowBackIcon />,
      name: "Back to main menu",
      onClick: () => navigate("/home"),
    },
    {
      icon: <ViewInArIcon />,
      name: "Add templates to scene",
      onClick: () => {
        toggleDrawer(true);
      },
    },
    {
      icon: <SaveIcon />,
      name: "Save scene to .GLB",
      onClick: () => {
        if (!activeProjectRef.current) return;
        exportSceneGLB(activeProjectRef.current.scene as THREE.Scene);
      },
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Main SpeedDial"
      direction="down"
      sx={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}
      icon={<MenuIcon />}
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
  );
}

export default Scene3DButtons;
