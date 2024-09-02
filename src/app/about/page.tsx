import Link from "next/link";

/*# Transfer Helper 🐇
(https://transfer.lehuy.dev)[transfer.lehuy.dev]

🐇 Get your California Community College transfer plan in minutes!

## How It Works
1. Choose your community college
2. Pick your target UCs or CSUs
3. Select your desired majors
4. Answer a few quick questions

**You're done! Review your required class list and plan accordingly 🎉**

## Better than ASSIST.org

### Before
- 🤼 Juggle multiple links for each college and major
- 🐢 Manually check for requirements
- 😓 No built-in way to track course selections
- 💀 Waste counselor time checking ASSIST.org during appointments

### After
- 🥹 View all colleges and majors in a single page
- 🐇 Automatically picks the best requirements
- 🤓 Built-in way to track course selections
- 👍 Start your counseling session PREPARED!

> ⚠️ THIS IS NOT A REPLACEMENT FOR A COLLEGE COUNSELOR ⚠️

You can use this tool to help you plan your transfer, but it is not a replacement for a college counselor.*/
export default function About() {
    return (
        <main className="w-full max-w-4xl mx-auto p-8 pb-24">
            <article className="prose prose-invert max-w-none">
                <h1>Welcome to Transfer Helper</h1>
                <p>Transfer Helper is a tool to help you plan your transfer to a California Community College. It uses data from <a href="https://assist.org">ASSIST.org</a> to generate a list of required classes FAST!!</p>
                <h1>How It Works</h1>
                <ol>
                    <li>Choose your community college</li>
                    <li>Pick your target UCs or CSUs</li>
                    <li>Select your desired majors</li>
                    <li>Answer a few quick questions</li>
                </ol>
                <p><strong>You're done! Review your required class list and plan accordingly 🎉</strong></p>
                <h1>Better than ASSIST.org</h1>
                <h2>Before</h2>
                <ul>
                    <li>🤼 Juggle multiple links for each college and major</li>
                    <li>🐢 Manually check for requirements</li>
                    <li>😓 No built-in way to track course selections</li>
                    <li>💀 Waste counselor time checking ASSIST.org during appointments</li>
                </ul>
                <h2>After</h2>
                <ul>
                    <li>🥹 View all colleges and majors in a single page</li>
                    <li>🐇 Automatically picks the best requirements</li>
                    <li>🤓 Built-in way to track course selections</li>
                    <li>👍 Start your counseling session PREPARED!</li>
                </ul>
                <blockquote>
                    <p>⚠️ THIS IS NOT A REPLACEMENT FOR A COLLEGE COUNSELOR ⚠️</p>
                    <p>You can use this tool to help you plan your transfer, but it is not a replacement for a college counselor.</p>
                </blockquote>
                <p>
                    <b>Ready to get started?</b>
                </p>
                <p>
                    <Link href="/">
                        Click here to pick your primary community college
                    </Link>
                </p>
            </article>
        </main>
    )


}