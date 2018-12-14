#!/usr/bin/env Rscript

library(ggplot2);

source("scripts/read-data.R");

# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make scatter plots for
data_names = c("normal-1");


for (data_name in data_names) {
    data = data.frame(project = NA,
                      group = NA,
                      max_passes = NA,
                      max_points = NA,
                      passes = NA,
                      points = NA);
    names(data) = c("project", "group", "max_passes", "max_points", "passes", "points");

    test_results = csvs.test_results[[data_name]];
    test_passes = list();

    for (group in 1:length(mapping.normal.tests)) {
        mapped_test_ids = mapping.normal.tests[[group]];
        passes = unlist(lapply(test_results, function(x) as.vector(table(x[mapped_test_ids, "status"])["pass"])));
        points = unlist(csvs.keller_points[group,]);

        for (project in ids) {
            max_passes = length(mapping.normal.tests[[group]]);
            max_points = mapping.normal.points[[group]];

            data = rbind(data, c(project = project,
                                 group = group,
                                 max_passes = max_passes,
                                 max_points = max_points,
                                 passes = passes[project],
                                 points = points[project]));
        }
    }

    data = data[-1,];
    print(data);
}
