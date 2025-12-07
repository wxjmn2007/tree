import React from 'react';
import { TreeState } from '../types';

interface ExperienceProps {
  treeState: TreeState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return <div>3D Tree Placeholder. State: {treeState}</div>;
};

export default Experience;

