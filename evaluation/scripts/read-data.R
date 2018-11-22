#!/usr/bin/env Rscript

library(tools);


########## Read test results and coverage ######################################

dir         = file.path("data", "test-results");
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.test_results  = list();
csvs.test_coverage = list();

for (i in 1:length(dirs)) {
    dir                            = file.path(dirs[[i]], "csv");
    files                          = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.test_results[[i]]         = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.test_results[[i]])  = lapply(files, function(file) file_path_sans_ext(basename(file)));

    dir                            = file.path(dirs[[i]], "cov");
    files                          = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.test_coverage[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.test_coverage[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.test_results)  = names(dirs);
names(csvs.test_coverage) = names(dirs);


########## Read the data of the manual evaluation ##############################

file                           = file.path("data", "ba-keller-data", "scores.csv");
csvs.keller_data               = read.csv(file);
csvs.keller_data.points        = csvs.keller_data$Points;
names(csvs.keller_data.points) = csvs.keller_data$Student



########## Other data ##########################################################

# Projects which are completely excluded from the evaluation
# K6_S06 got scored 30 points but the projects has no code.
projects.exculded = c("K6_S06");

# Projects for which the project file exists
projects.files = setdiff(names(csvs.test_results[[1]]), projects.exculded);

# Projects which were scored manually
projects.scored = setdiff(csvs.keller_data$Student, projects.exculded);

# Projects for which the project file exists and which were scored manually
projects.intersect = intersect(projects.files, projects.scored);

# Projects that don't work properly and can be filtered out (e.g. wrong sprite names, don't start on green flag etc.)
projects.filter = c(

    # Some sprite or variable has the wrong name
    "K6_S12", # Deleted variable: time
    "K6_S17", # Renamed variable: "Punkte" to "Bunkte"
    "K7_S24", # Deleted variable: time
    "K7_S27", # Renamed Sprite: "Bowl" to "Figur2" (also uses sprite for red line)

    # Zero Coverage
    "K6_S01", # Starts on up key press instead of green flag
    "K6_S06", # Wrong scratch project file (scored 30 points but has no code)
    "K6_S14", # Starts on space key press instead of green flag

    # Game Over on startup
    "K6_S20", # Has to be started twice
    "K7_S18"  # Sprites have to be dragged up to make it work
);

# Properly working projects for which the project file exists and which were scored manually
projects.filtered = setdiff(projects.intersect, projects.filter);
