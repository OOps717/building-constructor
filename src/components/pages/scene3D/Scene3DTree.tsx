import * as THREE from "three";
import type { RefObject } from "react";
import { SimpleTreeView } from "@mui/x-tree-view";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { useEffect, useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import { Typography } from "@mui/material";

type SceneNode = {
  id: string;
  name: string;
  type: string;
  children: SceneNode[];
};

function buildScene3DTree(object: THREE.Object3D): SceneNode {
  return {
    id: object.uuid,
    name: object.name || object.type,
    type: object.type,
    children: object.children.map(buildScene3DTree),
  };
}

const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.grey[200],
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    margin: theme.spacing(0.2, 0),
    [`& .${treeItemClasses.label}`]: {
      fontSize: "0.8rem",
      fontWeight: 500,
    },
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.dark,
    padding: theme.spacing(0, 1.2),
    ...theme.applyStyles("light", {
      backgroundColor: alpha(theme.palette.primary.main, 0.25),
    }),
    ...theme.applyStyles("dark", {
      color: theme.palette.primary.contrastText,
    }),
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  ...theme.applyStyles("light", {
    color: theme.palette.grey[800],
  }),
}));

function renderNode(node: SceneNode) {
  return (
    <CustomTreeItem
      key={node.id}
      itemId={node.id}
      label={`${node.name} (${node.type})`}
    >
      <Typography variant="body2">{node.children.map(renderNode)}</Typography>
    </CustomTreeItem>
  );
}

// If an object is added
// function addObject(parent: THREE.Object3D, child: THREE.Object3D) {
//   parent.add(child);
//   updateOutliner();
// }

// If we selected one objet
// onItemSelectionToggle={(_, uuid) => {
//   const obj = scene.getObjectByProperty("uuid", uuid);
//   if (obj) {
//     selectObject(obj); // highlight / gizmo
//   }
// }}

interface Props {
  scene3DRef: RefObject<THREE.Scene | null>;
  sceneReady: boolean;
}

function Scene3DTree(props: Props) {
  const { scene3DRef, sceneReady } = props;
  const [scene3DTree, setScene3DTree] = useState<SceneNode | null>(null);

  useEffect(() => {
    if (!sceneReady || !scene3DRef.current) return;
    setScene3DTree(buildScene3DTree(scene3DRef.current));
  }, [sceneReady]);

  return (
    <SimpleTreeView
      onItemSelectionToggle={(_, itemId) => {
        console.log("Selected object uuid:", itemId);
      }}
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        fontSize: 13,
        color: "text.primary",
        borderLeft: "solid",
        borderTop: "solid",
        borderColor: "#301f32cc",
      }}
    >
      {scene3DTree && renderNode(scene3DTree)}
    </SimpleTreeView>
  );
}

export default Scene3DTree;
