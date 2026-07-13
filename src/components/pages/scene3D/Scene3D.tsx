import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { initThree } from "../../uiComponents/3D/main.js";
import { Box, Switch, FormControlLabel, Typography } from "@mui/material";
import Scene3DButtons from "./Scene3DButtons.js";
import TemplatesDrawer from "./TemplatesDrawer.js";
import Scene3DTree from "./Scene3DTree.js";
import { getRenderer } from "../../uiComponents/3D/renderer.js";
import type { RefObject } from "react";
import type { SceneInteractor } from "../../uiComponents/3D/sceneInteractor.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface Props {
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  activeProjectRef: RefObject<SceneInteractor | null>;
  objModulesRef: RefObject<Record<string, string>>;
  objCacheRef: RefObject<Map<string, THREE.Group>>;
  sceneVersion: number;
  notifySceneChanged: () => void;
}

function Scene3D(props: Props) {
  const {
    rendererRef,
    activeProjectRef,
    objModulesRef,
    objCacheRef,
    sceneVersion,
    notifySceneChanged,
  } = props;
  const [open, setOpen] = useState(false);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const focusOnObjectRef = useRef<boolean>(false);
  const selectedToDropRef = useRef<string | null | undefined>(null);
  const selectedToDropOBJRef = useRef<string | null | undefined>(null);
  const selectMeshRef = useRef<THREE.Object3D | null>(null);
  const isSnappingRef = useRef<boolean>(false);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const isDirty = useRef<boolean>(true);

  const handleSwitchChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    isSnappingRef.current = checked;
  };

  const toggleDrawer = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  // Create scene 3D with webGL by passing render (to avoid render recreation)
  useEffect(() => {
    if (!threeContainerRef.current) return;

    rendererRef.current = getRenderer(
      threeContainerRef.current,
      rendererRef.current,
    );

    const cleanUp = initThree({
      container: threeContainerRef.current,
      renderer: rendererRef.current,
      activeProjectRef,
      transformControlsRef,
      orbitControlsRef,
      objCacheRef,
      selectedToDropRef,
      selectedToDropOBJRef,
      selectMeshRef,
      focusOnObjectRef,
      isSnappingRef,
      isDirty,
      notifySceneChanged,
    });
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
        selectedToDropRef={selectedToDropRef}
        selectedToDropOBJRef={selectedToDropOBJRef}
        objModulesRef={objModulesRef}
        objCacheRef={objCacheRef}
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
          selectMeshRef={selectMeshRef}
          focusOnObjectRef={focusOnObjectRef}
        ></Scene3DTree>
      </Box>
    </Box>
  );
}

export default Scene3D;
