import React from "react";
import css from "./header.module.scss";
import { Button } from "./nested-directory/button";

interface HeaderProps {
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header className={css.header}>
            <span>{title}</span>
            <Button />
        </header>
    );
};
