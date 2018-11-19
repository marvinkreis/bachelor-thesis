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

# Projects for which the project file exits
projects.projects = names(csvs.test_results[[1]]);

# Projects which were scored manually
projects.manual = csvs.keller_data$Student;

# Projects for which the project file exists and which were scored manually
projects.intersect = intersect(projects.projects, projects.manual);

# Projects that don't work properly and can be filtered out (e.g. wrong sprite names, don't start on green flag etc.)
projects.filter = c(
    "K6_S12",
    "K6_S17",
    "K7_S24",
    "K7_S27",
    "K6_S01",
    "K6_S06",
    "K6_S20",
    "K7_S18"
);

# Properly working projects for which the project file exists and which were scored manually
projects.filtered = setdiff(projects.intersect, projects.filter);
