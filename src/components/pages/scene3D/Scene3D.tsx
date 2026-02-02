import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { initThree } from "../../components/3D/main.js";
import { Box, Switch, FormControlLabel, Typography } from "@mui/material";
import Scene3DButtons from "./Scene3DButtons.js";
import TemplatesDrawer from "./TemplatesDrawer.js";
import Scene3DTree from "./Scene3DTree.js";
import { getRenderer } from "../../components/3D/renderer.js";
import type { RefObject } from "react";
import type { SceneInteractor } from "../../components/3D/sceneInteractor.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

interface Props {
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  activeProjectRef: RefObject<SceneInteractor | null>;
  sceneVersion: number;
  notifySceneChanged: () => void;
}

function Scene3D(props: Props) {
  const { rendererRef, activeProjectRef, sceneVersion, notifySceneChanged } =
    props;
  const [open, setOpen] = useState(false);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const isSnapping = useRef<boolean>(false);
  const selectedToDrop = useRef<string | null | undefined>(null);

  const handleSwitchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    isSnapping.current = checked;
  };

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
      transformControlsRef,
      isSnapping,
      selectedToDrop,
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
        selectedToDrop={selectedToDrop}
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
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 16,
            zIndex: 10,
            bgcolor: "white",
            borderRadius: 1,
            paddingLeft: 1,
          }}
        >
          <FormControlLabel
            control={<Switch onChange={handleSwitchChange} />}
            label={
              <Typography variant="body2" color="primary.main">
                Snap down to objects
              </Typography>
            }
          />
        </Box>
        <Scene3DTree
          activeProjectRef={activeProjectRef}
          sceneVersion={sceneVersion}
        ></Scene3DTree>
      </Box>
    </Box>
  );
}

export default Scene3D;
