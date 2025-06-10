import { ToggleTheme } from "./ToggleTheme";

const Header: React.FC = () => {
    return (
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 dark:from-indigo-900 dark:to-purple-900">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-4xl font-bold text-white">
                        SEO Analyzer
                    </h1>
                </div>
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <ToggleTheme />
                </div>
            </div>
        </header>
    )
}

export default Header;