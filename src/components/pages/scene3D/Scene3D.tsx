import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { initThree } from "../../components/3D/main.js";
import { Box } from "@mui/material";
import Scene3DButtons from "./Scene3DButtons.js";
import TemplatesDrawer from "./TemplatesDrawer.js";
import Scene3DTree from "./Scene3DTree.js";

interface Props {
  activeTab: string;
}

function Scene3D(props: Props) {
  const { activeTab } = props;
  const [sceneReady, setSceneReady] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleDrawer = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const scene3DRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!threeContainerRef.current) return;
    const cleanup = initThree(
      threeContainerRef.current,
      activeTab,
      scene3DRef,
      () => setSceneReady(true),
    );
    return cleanup;
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
        scene3DRef={scene3DRef}
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
          scene3DRef={scene3DRef}
          sceneReady={sceneReady}
        ></Scene3DTree>
      </Box>
    </Box>
  );
}

export default Scene3D;
