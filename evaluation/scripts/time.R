#!/usr/bin/env Rscript

source("scripts/read-data.R");
source("scripts/annotate-plot.R");

# The names of the projects to be used in the scatter plot
ids = projects.filtered;


data_sets = list("tests-normal"      = list("sample", "sample-2"),
                 "tests-constraint"  = list("sample", "sample-2"),
                 "tests-random"      = list("sample", "sample-2"),
                 "tests-random-lite" = list("sample", "sample-2"));

data = data.frame(NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA, NA);
names(data) = c("test",
                "avg-callbacks-before",
                "max-callbacks-before",
                "avg-random-inputs",
                "max-random-inputs",
                "avg-inputs",
                "max-inputs",
                "avg-sprites",
                "max-sprites",
                "avg-scratch",
                "max-scratch",
                "avg-callbacks-after",
                "max-callbacks-after",
                "avg-constraints",
                "max-constraints",
                "avg-total",
                "max-total",
                "avg-total-no-scratch",
                "max-total-no-scratch");

for (test in names(data_sets)) {
    for (project in data_sets[[test]]) {
        times = csvs.time[[test]][[project]][-1:-30,];
        line = c(test);
        line[2]  = round(mean(times[,"callbacks-before"]), digits = 4);
        line[3]  = round( max(times[,"callbacks-before"]), digits = 4);
        line[4]  = round(mean(times[,"random-inputs"]   ), digits = 4);
        line[5]  = round( max(times[,"random-inputs"]   ), digits = 4);
        line[6]  = round(mean(times[,"inputs"]          ), digits = 4);
        line[7]  = round( max(times[,"inputs"]          ), digits = 4);
        line[8]  = round(mean(times[,"sprites"]         ), digits = 4);
        line[9]  = round( max(times[,"sprites"]         ), digits = 4);
        line[10] = round(mean(times[,"scratch"]         ), digits = 4);
        line[11] = round( max(times[,"scratch"]         ), digits = 4);
        line[12] = round(mean(times[,"callbacks-after"] ), digits = 4);
        line[13] = round( max(times[,"callbacks-after"] ), digits = 4);
        line[14] = round(mean(times[,"constraints"]     ), digits = 4);
        line[15] = round( max(times[,"constraints"]     ), digits = 4);
        line[16] = round(mean(rowSums(times)        ), digits = 4);
        line[17] = round( max(rowSums(times)        ), digits = 4);
        line[18] = round(mean(rowSums(times) - times[,"scratch"]), digits = 4);
        line[19] = round( max(rowSums(times) - times[,"scratch"]), digits = 4);
        data = rbind(data, line);
    }
}

data = data[-1,];
print(data);

################################################################################

data = data.frame(NA, NA, NA, NA);
names(data) = c("component",
                "project",
                "avg-component",
                "avg-scratch");

data_sets = list("callbacks-before"  = list("empty", "noop", "spin"),
                 "random-inputs"     = list("empty", "noop", "spin"),
                 "inputs"            = list("empty", "noop", "spin"),
                 "sprites"           = list("clones-spin", "clones"),
                 "callbacks-after"   = list("empty", "noop", "spin"),
                 "constraints"       = list("empty", "noop", "spin"))

for (component in names(data_sets)) {
    for (project in data_sets[[component]]) {
        times = csvs.time[[component]][[project]][-1:-30,];
        line = c(component,
                 project,
                 round(mean(times[,component]), digits = 4),
                 round(mean(times[,"scratch"]), digits = 4));
        data = rbind(data, line);
    }
}

data = data[-1,];
print(data);
