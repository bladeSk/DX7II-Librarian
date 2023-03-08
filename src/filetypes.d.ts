declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
    const src: string
    export default src
}

declare module '*.svg' {
  import * as React from 'react'

  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}
