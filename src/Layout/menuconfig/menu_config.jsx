import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteIcon from "@mui/icons-material/EditNote";
import TableViewIcon from "@mui/icons-material/TableView";

export const sideMenu = [
  {
    label: "Home",
    Icon: HomeIcon,
    to: "/home",
  },
  {
    label: "Settings",
    Icon: SettingsIcon,
    to: "/settings",
  },
  // {
  //     label: "Registration",
  //     Icon: HowToRegIcon,
  //     to: "/register",
  // },
  {
    label: "Excel Template",
    Icon: EditNoteIcon,
    to: "/excelTemplate",
  },
  {
    label: "Table Names",
    Icon: TableViewIcon,
    to: "/tablenames",
  },
];
