interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = '모여라', subtitle = '약속 장소 추천' }: HeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <span className="badge w-fit">Kakao Maps Powered</span>
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
      {subtitle ? <p className="max-w-2xl text-sm text-slate-300 md:text-base">{subtitle}</p> : null}
    </header>
  )
}
