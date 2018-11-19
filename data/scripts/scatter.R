#!/usr/bin/env Rscript

library(ggplot2);

source("scripts/constants.R");

source(SCRIPTS.READ_CSVS);
passes = unlist(lapply(csvs.normal, function(x) as.vector(table(x$status)["pass"])));
passes[is.na(passes)] = 0;
points = keller.points;

ids = intersect(names(passes), names(points));
data = data.frame(points = points[ids], passes = passes[ids]);

filteredIds = setdiff(ids, c("K6_S12", "K6_S17", "K7_S24", "K7_S27", "K6_S01", "K6_S06", "K6_S20", "K7_S18"));
filteredData = data.frame(points = points[filteredIds], passes = passes[filteredIds]);

scatter = ggplot(data = data, aes(x = points, y = passes)) +
    geom_point(shape = 1, size = 2) +
    geom_smooth(method = lm, se = FALSE) +
    theme_light() +
    xlab("Points") +
    ylab("Test Passes");

filteredScatter = ggplot(data = filteredData, aes(x = points, y = passes)) +
    geom_point(shape = 1, size = 2) +
    geom_smooth(method = lm, se = FALSE) +
    theme_light() +
    xlab("Points") +
    ylab("Test Passes");

ggsave("scatter.pdf", plot = scatter, width = 10, height = 10, units = "cm");
ggsave("scatter-filtered.pdf", plot = filteredScatter, width = 10, height = 10, units = "cm");
