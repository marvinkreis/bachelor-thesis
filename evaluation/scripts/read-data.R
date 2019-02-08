#!/usr/bin/env Rscript

library(tools);


########## Read test results ###################################################

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


########## Read manual evaluation results ######################################

file                 = file.path("data", "ba-keller-data", "overview.csv");
csvs.keller_overview = read.csv(file);

file                     = file.path("data", "ba-keller-data", "scores-6.csv");
csvs.keller_points       = read.csv(file, header=TRUE);
file                     = file.path("data", "ba-keller-data", "scores-7.csv");
csvs.keller_points       = cbind(csvs.keller_points, read.csv(file, header=TRUE));
csvs.keller_points.total = colSums(csvs.keller_points);


########## Read coverage results ###############################################

dir         = file.path("data", "coverage-results");
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.coverage = list();

for (i in 1:length(dirs)) {
    dir                       = file.path(dirs[[i]], "cov");
    files                     = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.coverage[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE));
    names(csvs.coverage[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.coverage) = names(dirs);


########## Read time results ###############################################

dir         = file.path("data", "time-results");
dirs        = list.files(dir, full.names=TRUE);
names(dirs) = lapply(dirs, basename);

csvs.time   = list();

for (i in 1:length(dirs)) {
    dir                   = file.path(dirs[[i]], "time");
    files                 = list.files(dir, pattern="*.csv", full.names=TRUE);
    csvs.time[[i]]        = lapply(files, function(file) read.csv(file, header=TRUE, check.names=FALSE));
    names(csvs.time[[i]]) = lapply(files, function(file) file_path_sans_ext(basename(file)));
}

names(csvs.time) = names(dirs);


########## Project categories ##################################################

# Projects for which the project file exists
projects.files = c("K6_S01", "K6_S02", "K6_S03", "K6_S05", "K6_S06", "K6_S10", "K6_S11", "K6_S13",
                   "K6_S14", "K6_S15", "K6_S16", "K6_S18", "K6_S19", "K6_S20", "K6_S27", "K6_S29",
                   "K6_S30", "K6_S31", "K6_S33", "K7_S02", "K7_S03", "K7_S04", "K7_S05", "K7_S06",
                   "K7_S07", "K7_S08", "K7_S10", "K7_S11", "K7_S12", "K7_S14", "K7_S15", "K7_S16",
                   "K7_S17", "K7_S18", "K7_S19", "K7_S20", "K7_S26");

# Projects which were scored manually
projects.scored = names(csvs.keller_points);

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
    "K7_S18", # Sprites have to be dragged up to make it work

    # Other reasons
    "K7_S07"  # Resets all position when the "a" key is pressed, which gets picked up by random input generation
);

# Properly working projects for which the project file exists and which were scored manually
projects.filtered = setdiff(projects.intersect, projects.filter);


########## Mapping between categories of manual evaluation and tests ##########

# # Normal Tests
#
# # How many points for each category
# mapping.normal.points = list();
# # What tests correspond to each category
# mapping.normal.tests = list();
#
# mapping.normal.points[[1]]  = 2;
# mapping.normal.points[[2]]  = 2;
# mapping.normal.points[[3]]  = 3;
# mapping.normal.points[[4]]  = 3;
# mapping.normal.points[[5]]  = 2;
# mapping.normal.points[[6]]  = 1;
# mapping.normal.points[[7]]  = 2;
# mapping.normal.points[[8]]  = 2;
# mapping.normal.points[[9]]  = 2;
# mapping.normal.points[[10]] = 3;
# mapping.normal.points[[11]] = 3;
# mapping.normal.points[[12]] = 3;
# mapping.normal.points[[13]] = 4;
#
# mapping.normal.tests[[1]]  = c(20, 23);
# mapping.normal.tests[[2]]  = c(07, 09);
# mapping.normal.tests[[3]]  = c(21, 22);
# mapping.normal.tests[[4]]  = c(24, 25);
# mapping.normal.tests[[5]]  = c(01, 26);
# mapping.normal.tests[[6]]  = c(16, 17);
# mapping.normal.tests[[7]]  = c(03);
# mapping.normal.tests[[8]]  = c();
# mapping.normal.tests[[9]]  = c(07, 09);
# mapping.normal.tests[[10]] = c(27, 28);
# mapping.normal.tests[[11]] = c(10, 11, 12, 13, 14, 15);
# mapping.normal.tests[[12]] = c(02, 04, 05);
# mapping.normal.tests[[13]] = c(18, 19);
#
# names(mapping.normal.tests) = 1:13;
#
# # Constraint-only tests
#
# # How many points for each category
# mapping.constraint.points = list();
# # What tests correspond to each category
# mapping.constraint.tests = list();
#
# mapping.constraint.points[[1]]  = 2;
# mapping.constraint.points[[2]]  = 2;
# mapping.constraint.points[[3]]  = 3;
# mapping.constraint.points[[4]]  = 3;
# mapping.constraint.points[[5]]  = 2;
# mapping.constraint.points[[6]]  = 1;
# mapping.constraint.points[[7]]  = 2;
# mapping.constraint.points[[8]]  = 2;
# mapping.constraint.points[[9]]  = 2;
# mapping.constraint.points[[10]] = 3;
# mapping.constraint.points[[11]] = 3;
# mapping.constraint.points[[12]] = 3;
# mapping.constraint.points[[13]] = 4;
#
# mapping.constraint.tests[[1]]  = c(12, 15);
# mapping.constraint.tests[[2]]  = c(04, 05);
# mapping.constraint.tests[[3]]  = c(13, 14);
# mapping.constraint.tests[[4]]  = c(16, 17);
# mapping.constraint.tests[[5]]  = c(18);
# mapping.constraint.tests[[6]]  = c(10, 11);
# mapping.constraint.tests[[7]]  = c(01);
# mapping.constraint.tests[[8]]  = c();
# mapping.constraint.tests[[9]]  = c(04, 05);
# mapping.constraint.tests[[10]] = c(19, 20);
# mapping.constraint.tests[[11]] = c(06, 07, 08, 09);
# mapping.constraint.tests[[12]] = c(02, 03);
# mapping.constraint.tests[[13]] = c();
#
# names(mapping.normal.tests) = 1:13;
