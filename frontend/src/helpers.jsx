import React from 'react'

import * as icons from './components/icons'

// const LAYOUTS = ["mobile", "tablet", "desktop"];

export function ResponsiveIcon ({ icon }) {
  const iconElement = null
  const IconTag = icons[icon]
  // TODO generalize?
  return (
    <>
      <IconTag className='th-d-block th-d-tablet-none' size={IconTag.responsiveSizes?.mobile || 12} />
      <IconTag className='th-d-none th-d-tablet-block' />
    </>
  )
}
