import { ToggleTheme } from "./ToggleTheme";

const Header : React.FC = () => {
    return (
        <header className="bg- p-4 dark:bg-zinc-800 dark:text-zinc-100 h-20 flex items-center justify-between flex-row">
            <h1 className="text-5xl ml-5">
                SEO Analyzer
            </h1>
            <div className="mr-10">
                <ToggleTheme />
            </div>
        </header>
    )
}

export default Header;