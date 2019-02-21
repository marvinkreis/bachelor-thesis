# Abstract

Scratch is commonly used to introduce students to the principles of computer programming.  As some courses in schools and universities are attended by a large number of students, one big disadvantage of Scratch becomes relevant: Grading Scratch assignments is troublesome.  Scratch's interactive nature makes grading very time-consuming, since many key presses and clicks are required to execute a program.  At the same time, automating this process is still an open problem, since Scratch's visual and auditory output make automation difficult.

In order to solve this problem, we implemented Whisker, a program which automates Scratch 3.0's input and output mechanisms to make functional testing for Scratch possible.  Whisker offers a JavaScript interface, that allows users to simulate input events on programs, and to access Scratch's visual output in the form of sprite attributes and variables.  Additionally, Whisker offers automated input generation, which can be used to control Scratch programs automatically.  With this, we explore a property-based approach to testing by defining constraints, that the program under test must hold.

To evaluate Whisker, we tested a collection of student solutions from a sixth and seventh grade Scratch workshop.  Our test results closely match scores from independent manual grading, with an average Pearson's correlation coefficient of 0.882 over ten test executions.  Furthermore, we evaluated Whisker's automated input generation by measuring its statement coverage on the sample solutions to Code Club's Scratch courses, on which was able to achieve a mean statement coverage of 95.25\% over ten runs.

# Evaluation Data

The `evaluation` directory contains data from the evaluation, as well as scripts to analyze the data and to reproduce the diagrams in the thesis.

## Data Directories

`ba-keller-data`
 Data from the scratch workshop: sample solution and scores for student solutions.

`test`, `test-results`
 Test suites and test results for the projects of the Scratch workshop.

`coverage`, `coverage-results`
Coverage measurements of automated input generation.

`time`, `time-results`
Time measurements of test suite executions.

`code-club-stats`
Block counts and input methods of the used Code Club projects.

## Scripts for Converting Data

`convert-tap.js [--constraint] [FILE]..`
Converts TAP13 reports into CSV files and coverage reports.

`convert-coverage.js [FILE]...`
Converts coverage measurements into CSV files.

`convert-time.js [FILE]...`
Converts time measurements into CSV files.

---

The scripts will create new folders named `tap`, `csv`, `time` and `cov` with the converted data in the working directory. Following JavaScript Modules are required by the scripts:

    * tap-parser
    * csv-stringify
    * js-yaml
    * minimist

---

Example usage:

    cd evaluation/data/test-results/normal-1
    ../../../scripts/convert-tap.js raw/*

## Scripts for Generating Plots

`scatter.R`
Creates scatter plots of manual scores and test passes.

`consistency.R`
Creates bar plots of inconsistent test outcomes.

`coverage.R`
Creates bar plots and line plots of achieved coverage.

`time.R`
Creates line plots of time measurements.

---

These scripts have to be executed from the `evaluation` directory. Following R packages are required:

    * ggplot2
    * dplyr
    * viridis

---

Example usage:

    cd evaluation
    ./scatter.R
