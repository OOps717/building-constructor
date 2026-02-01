import * as THREE from "three";
import type { RefObject } from "react";
import { SimpleTreeView } from "@mui/x-tree-view";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { useCallback, useEffect, useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import type { ProjectRuntime } from "../../../App";
import { EditableTypography } from "../../components/UI/EditableTypography";

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

interface Props {
  activeProjectRef: RefObject<ProjectRuntime | null>;
  sceneVersion: number;
}

function Scene3DTree(props: Props) {
  const { activeProjectRef, sceneVersion } = props;
  const [scene3DTree, setScene3DTree] = useState<SceneNode | null>(null);

  const updateTree = useCallback(() => {
    const scene = activeProjectRef.current?.scene;
    if (!scene) return;

    setScene3DTree(buildScene3DTree(scene));
  }, []);

  useEffect(() => {
    updateTree();
  }, [sceneVersion, updateTree]);

  const renderNode = (node: SceneNode) => {
    return (
      <CustomTreeItem
        key={node.id}
        itemId={node.id}
        label={
          <EditableTypography
            onChange={(newName) => {
              node.name = newName;
              const object3D = (
                activeProjectRef.current?.scene as THREE.Scene
              ).getObjectByProperty("uuid", node.id);
              if (object3D) object3D.name = newName;
              updateTree();
            }}
          >
            {`${node.name} (${node.type})`}
          </EditableTypography>
        }
      >
        {node.children.map(renderNode)}
      </CustomTreeItem>
    );
  };

  return (
    <SimpleTreeView
      // onItemSelectionToggle={(_, itemId) => {
      //   console.log("Selected object uuid:", itemId);
      // }}
      // onInput={(e) => console.log(e.currentTarget.value)}
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
