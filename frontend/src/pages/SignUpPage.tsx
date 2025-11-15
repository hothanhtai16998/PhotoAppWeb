import { SignupForm } from "@/components/auth/signup-form"

function SignUpPage() {
    return (
        <>
            {/* <Header /> */}
            <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0">
                <div className="w-full max-w-sm md:max-w-4xl">
                    <SignupForm />
                </div>
            </div>
        </>
    )
}

export default SignUpPage