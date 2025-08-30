'use client';

import React, { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useTranslations } from 'next-intl';

import { TreeItem } from '@mui/x-tree-view/TreeItem';
import usePOIStore from '@/src/store/poiStore';

import { useShallow } from 'zustand/shallow';
import { Button } from '@mui/material';
import { Category } from '@mui/icons-material';
import { useMapContext } from '@/src/contexts/MapContext';

interface SelectedCategories {
  [id: string]: boolean;
}

const CategorySelector = () => {
  const t = useTranslations('Category');

  const {
    setSelectedCategories,
    setSelectedCategoryGroups,
    selectedCategories,
    selectedCategoryGroups,
  } = useMapContext();

  const [categories] = usePOIStore(useShallow((state) => [state.categories]));

  const [showTree, setShowTree] = useState(false);

  const handleToggle = (id: string, isGroup: boolean) => {
    if (isGroup) {
      return setSelectedCategoryGroups((prev: SelectedCategories) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }

    setSelectedCategories((prev: SelectedCategories) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderTreeItems = (nodeName: string, nodeData: any, parentId = '') => {
    const node = parentId ? `${parentId}-${nodeName}` : nodeName;
    const nodeId = nodeData?.id || nodeData;

    const childrenItems = nodeData.children
      ? Object.entries(nodeData.children).map(([childName, childData]) =>
          renderTreeItems(childName, childData, node),
        )
      : Object.entries(nodeData).map(([childName, childData]) =>
          renderTreeItems(childName, childData, node),
        );

    return (
      <TreeItem
        key={node}
        itemId={node}
        style={{
          marginBlock: '10px',
        }}
        label={
          <div onClick={(e) => e.stopPropagation()}>
            {(nodeData?.id !== undefined || typeof nodeData === 'number') && (
              <input
                type="checkbox"
                checked={
                  !!selectedCategories[nodeId] ||
                  !!selectedCategoryGroups[nodeId]
                }
                onChange={() => handleToggle(nodeId, Boolean(nodeData?.id))}
              />
            )}
            <span
              style={{
                marginLeft: '6px',
              }}
            >
              {nodeName}
            </span>
          </div>
        }
      >
        {childrenItems}
      </TreeItem>
    );
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setShowTree((prev) => !prev)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 998,
          height: '50px',
          width: '50px',
          borderRadius: '10%',
          padding: 0,
          minWidth: 0,
        }}
      >
        <Category />
      </Button>

      {showTree && (
        <div
          style={{
            position: 'absolute',
            top: '240px',
            right: '10px',
            zIndex: 1001,
            backgroundColor: 'white',
            maxHeight: 'calc(50vh)',
            overflow: 'scroll',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          <SimpleTreeView>
            {Object.entries(categories).map(([groupName, groupData]) =>
              renderTreeItems(groupName, groupData),
            )}
          </SimpleTreeView>
        </div>
      )}
    </>
  );
};

export default CategorySelector;
