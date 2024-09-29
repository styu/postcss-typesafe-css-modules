import React from "react";
import css from "./header.module.scss.js";

interface HeaderProps {
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header className={css.header}>
            <span>{title}</span>
            <button>Action</button>
        </header>
    );
};
