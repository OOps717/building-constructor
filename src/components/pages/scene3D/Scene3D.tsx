import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { initThree } from "../../components/3D/main.js";
import { Box } from "@mui/material";
import Scene3DButtons from "./Scene3DButtons.js";
import TemplatesDrawer from "./TemplatesDrawer.js";
import Scene3DTree from "./Scene3DTree.js";
import { getRenderer } from "../../components/3D/renderer.js";
import type { RefObject } from "react";
import type { ProjectRuntime } from "../../../App.js";

interface Props {
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  activeProjectRef: RefObject<ProjectRuntime | null>;
  sceneVersion: number;
  notifySceneChanged: () => void;
}

function Scene3D(props: Props) {
  const { rendererRef, activeProjectRef, sceneVersion, notifySceneChanged } =
    props;
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const threeContainerRef = useRef<HTMLDivElement | null>(null);

  // Create scene 3D with webGL by passing render (to avoid render recreation)
  useEffect(() => {
    if (!threeContainerRef.current) return;

    rendererRef.current = getRenderer(
      threeContainerRef.current,
      rendererRef.current,
    );

    const cleanUp = initThree(
      threeContainerRef.current,
      rendererRef.current,
      activeProjectRef,
    );

    notifySceneChanged();
    return cleanUp;
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        height: "95vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Scene3DButtons
        activeProjectRef={activeProjectRef}
        toggleDrawer={toggleDrawer}
      ></Scene3DButtons>
      <TemplatesDrawer
        open={open}
        toggleDrawer={toggleDrawer}
      ></TemplatesDrawer>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
        }}
      >
        <Box
          ref={threeContainerRef}
          sx={{
            width: "87%",
            height: "100%",
          }}
        />
        <Scene3DTree
          activeProjectRef={activeProjectRef}
          sceneVersion={sceneVersion}
        ></Scene3DTree>
      </Box>
    </Box>
  );
}

export default Scene3D;
