#!/usr/bin/env Rscript

library(ggplot2);

source("scripts/read-data.R");

# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make scatter plots for
data_sets = list(normal = c("normal-1", "normal-2", "normal-3"),
                 constraint = c("constraint-1", "constraint-2", "constraint-3"));

for (set_name in names(data_sets)) {
    datas = list();
    for (data_name in data_sets[[set_name]]) {
        datas[[data_name]] = csvs.test_results[[data_name]][ids];
    }

    num_datas = length(datas);
    num_projects = length(datas[[1]]);
    num_tests = nrow(datas[[1]][[1]]);

    differences = matrix(nrow = num_projects, ncol = num_tests);
    rownames(differences) = names(datas[[1]]);
    colnames(differences) = 1:num_tests;

    for (p in 1:num_projects) {
        for (t in 1:num_tests) {
            test_outcome = as.character(datas[[1]][[p]]$status[t]);
            differences[p,t] = 0;
            for (d in 2:num_datas) {
                if (test_outcome != as.character(datas[[d]][[p]]$status[t])) {
                    differences[p,t] = 1;
                    break;
                }
            }
        }
    }

    inconsistencies_per_project = rowSums(differences);

    print(set_name);
    print(inconsistencies_per_project);
    print(mean(inconsistencies_per_project));

    data = data.frame(inconsistencies = inconsistencies_per_project,
                      projects = names(inconsistencies_per_project));

    bar_project = ggplot(data = data, aes(x = projects, y = inconsistencies)) +
        geom_col(width = 0.8) +
        labs(x = "Project", y = "Inconsistencies") +
        theme_light() +
        theme(text = element_text(size=10), axis.text.x = element_text(size = 6, angle = 90, hjust = 1));

    ggsave(paste("consistency-per-project-", set_name, ".pdf", sep=""), plot = bar_project, width = 12.5, height = 5, units = "cm");
}
