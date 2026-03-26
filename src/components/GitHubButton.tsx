import { FaGithub } from "react-icons/fa";
import { IconContext } from "react-icons";

const GitHubButton = () => {
  return (
    <IconContext.Provider value={{}}>
      <div className="tool-button">
        <a
          href="https://github.com/nanreh/calendar-hack"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Project source on GitHub"
          title="Project source on GitHub"
        >
          <FaGithub style={{ verticalAlign: "middle" }} />
        </a>
      </div>
    </IconContext.Provider>
  );
};

export default GitHubButton;
