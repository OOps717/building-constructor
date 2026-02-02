import { Drawer, Box, Button, Divider, Typography } from "@mui/material";
import type * as THREE from "three";
import { setObj } from "../../assetLoader";

const images = import.meta.glob("../../../assets/primitives/*.png", {
  eager: true,
});

const objectImages = import.meta.glob("../../../assets/templates/**/*.png", {
  eager: true,
});

interface Props {
  open: boolean;
  toggleDrawer: (newOpen: boolean) => void;
  selectedToDropRef: React.RefObject<string | null | undefined>;
  selectedToDropOBJRef: React.RefObject<string | null | undefined>;
  objModulesRef: React.RefObject<Record<string, string>>;
  objCacheRef: React.RefObject<Map<string, THREE.Group>>;
}

export default function TemplatesDrawer(props: Props) {
  const {
    open,
    toggleDrawer,
    selectedToDropRef,
    selectedToDropOBJRef,
    objModulesRef,
    objCacheRef,
  } = props;

  const meshPrimitives = Object.entries(images).map(([path, module]) => ({
    name: path.split("/").pop()?.replace(".png", ""),
    src: (module as any).default,
  }));

  const objects = Object.entries(objectImages).map(([path, module]) => ({
    name: path.split("/").pop()?.replace(".png", ""),
    src: (module as any).default,
  }));

  const DrawerList = (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" align="center" sx={{ paddingTop: "5%" }}>
        Primitives
      </Typography>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
        }}
        onClick={() => toggleDrawer(false)}
      >
        {meshPrimitives.map((mesh) => (
          <Button
            key={mesh.name}
            onClick={() => {
              selectedToDropRef.current = mesh.name;
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              p: 1,
            }}
          >
            <img
              src={mesh.src}
              alt={mesh.name}
              style={{
                width: "100%",
                height: 80,
                objectFit: "contain",
              }}
            />
            {mesh.name}
          </Button>
        ))}
      </Box>
      <Divider />
      <Typography variant="h5" align="center" sx={{ paddingTop: "5%" }}>
        Objects
      </Typography>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
        }}
        onClick={() => toggleDrawer(false)}
      >
        {objects.map((object) => (
          <Button
            key={object.name}
            onClick={async () => {
              await setObj(
                object.name || "undefined",
                objModulesRef,
                objCacheRef,
              );
              selectedToDropOBJRef.current = object.name;
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              p: 1,
            }}
          >
            <img
              src={object.src}
              alt={object.name}
              style={{
                width: "100%",
                height: 80,
                objectFit: "contain",
              }}
            />
            {object.name}
          </Button>
        ))}
      </Box>
    </Box>
  );

  return (
    <div>
      <Drawer
        open={open}
        onClose={() => toggleDrawer(false)}
        slotProps={{
          paper: {
            sx: {
              minWidth: "20%",
            },
          },
          backdrop: {
            sx: {
              backgroundColor: "transparent",
            },
          },
        }}
      >
        {DrawerList}
      </Drawer>
    </div>
  );
}
