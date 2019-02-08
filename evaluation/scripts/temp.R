#!/usr/bin/env Rscript

library(ggplot2);
library(scales);
library(grid);
library(gtable);

source("scripts/read-data.R");

data_sets = list(normal = c("normal-1", "normal-2", "normal-3", "normal-4", "normal-5"),
                 constraint = c("constraint-1", "constraint-2", "constraint-3", "constraint-4", "constraint-5"),
                 random = c("random-1"));

main = function () {
    for (set_name in names(data_sets)) {
        avg_passes = c(0);
        avg_coverage = c(0);

        passes = FALSE;

        for (data_name in data_sets[[set_name]]) {
            test_results  = csvs.test_results[[data_name]];

            passes = FALSE;

            for (x in test_results) {
                if (passes == FALSE) {
                    passes = as.numeric(x$status == "pass");
                } else {
                    passes = passes + as.numeric(x$status == "pass");
                }
            }

            print(data_name);
            print(passes);
        }
    }
}

main();
