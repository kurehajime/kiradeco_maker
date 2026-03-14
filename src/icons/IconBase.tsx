import type { PropsWithChildren, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

type IconBaseProps = PropsWithChildren<IconProps>

export function IconBase({ children, viewBox = '0 0 512 512', ...props }: IconBaseProps) {
  return (
    <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {children}
    </svg>
  )
}
