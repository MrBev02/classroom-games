#!/usr/bin/env python3
"""Make one self-contained file from the student page.

This program reads index.html and puts every local script and stylesheet
inside it. The result is one HTML file. Give that file to students through
Teams, Google Drive or a USB memory device. A student opens it and the
activity runs. There is no server and there is no internet connection.

This is not a build step. The activity runs from the separate files
without it. Use this program only when you need the single file.

    python3 build-standalone.py

The program writes roulette-student-standalone.html in this folder.

A link to a content delivery network becomes a comment. KaTeX is the only
one, and each question is also correct as plain text without it.
"""

import re
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = HERE / "index.html"
TARGET = HERE / "roulette-student-standalone.html"


def is_local(url):
    """True for a file in this repository."""
    return not url.startswith(("http://", "https://", "//"))


def read_local(url):
    path = (HERE / url).resolve()
    if not path.exists():
        raise SystemExit("Cannot find %s, which index.html asks for." % url)
    return path.read_text(encoding="utf-8")


def inline_scripts(html):
    def replace(match):
        url = match.group(1)
        if not is_local(url):
            return "<!-- %s is not available offline. The page works without it. -->" % url
        return "<script>\n/* %s */\n%s\n</script>" % (url, read_local(url))
    return re.sub(r'<script src="([^"]+)"></script>', replace, html)


def inline_styles(html):
    def replace(match):
        url = match.group(1)
        if not is_local(url):
            return "<!-- %s is not available offline. -->" % url
        css = read_local(url)
        # A stylesheet uses paths that are relative to the css folder. The
        # student page has no images, thus there is nothing to correct.
        return "<style>\n/* %s */\n%s\n</style>" % (url, css)
    return re.sub(r'<link rel="stylesheet" href="([^"]+)">', replace, html)


def main():
    if not SOURCE.exists():
        raise SystemExit("Cannot find index.html.")
    html = SOURCE.read_text(encoding="utf-8")

    # The favicon is a separate file. Remove the link so the page does not
    # ask for a file that is not there.
    html = re.sub(r'\s*<link rel="icon"[^>]*>', "", html)
    html = inline_styles(html)
    html = inline_scripts(html)

    note = ("<!--\n"
            "  This file was made by build-standalone.py.\n"
            "  Do not edit it. Edit the files in the roulette folder and\n"
            "  then run the program again.\n"
            "-->\n")
    html = html.replace("<!DOCTYPE html>", "<!DOCTYPE html>\n" + note, 1)

    TARGET.write_text(html, encoding="utf-8")
    size = TARGET.stat().st_size

    remaining = re.findall(r'(?:src|href)="((?!https?:|#|data:)[^"]+)"', html)
    if remaining:
        print("Warning. These files are still separate:", ", ".join(sorted(set(remaining))))

    print("Wrote %s (%.0f KB)." % (TARGET.name, size / 1024))
    print("Give this one file to students. It needs no server.")


if __name__ == "__main__":
    main()
