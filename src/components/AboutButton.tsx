import { FaInfoCircle } from "react-icons/fa";
import { IconContext } from "react-icons";
import { NavLink } from "react-router-dom";

const AboutButton = () => {
  return (
    <IconContext.Provider value={{}}>
      <div className="tool-button">
        <NavLink to="/about" aria-label="About" title="About">
          <FaInfoCircle style={{ verticalAlign: "middle" }} />
        </NavLink>
      </div>
    </IconContext.Provider>
  );
};

export default AboutButton;
