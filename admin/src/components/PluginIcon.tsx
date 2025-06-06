import * as StrapiIcons from '@strapi/icons'
import React from 'react'

interface PluginIconProps {
  icon?: keyof typeof StrapiIcons
}
const PluginIcon = ({icon}: PluginIconProps) => {
  let Comp = (StrapiIcons as Record<string, React.ComponentType>)[icon || 'PuzzlePiece']
  if (!Comp) {
    Comp = (StrapiIcons as Record<string, React.ComponentType>)['PuzzlePiece']
  }
  return <Comp />
}

export { PluginIcon }
