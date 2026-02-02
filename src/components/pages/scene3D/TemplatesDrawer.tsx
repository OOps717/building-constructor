import { Drawer, Box, Button, Divider, Typography } from "@mui/material";

const images = import.meta.glob("../../../assets/primitives/*.png", {
  eager: true,
});

interface Props {
  open: boolean;
  toggleDrawer: (newOpen: boolean) => void;
  selectedToDrop: React.RefObject<string | null | undefined>;
}

export default function TemplatesDrawer(props: Props) {
  const { open, toggleDrawer, selectedToDrop } = props;

  const meshPrimitives = Object.entries(images).map(([path, module]) => ({
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
              selectedToDrop.current = mesh.name;
            }}
            // onPointerDown={() => console.log(mesh.name)}
            // onPointerUp={() => console.log("button released")}
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
        <Divider />
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
