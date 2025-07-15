import { AuthForm } from "./auth-form"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <AuthForm mode="signin" className={className} {...props} />
}