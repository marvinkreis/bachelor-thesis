library(tools);

files = dir(DATA.TESTS.NORMAL, pattern="*.csv", full.names=TRUE);
csvs.normal = lapply(files, function(file) read.csv(file, header=TRUE));
names(csvs.normal) = lapply(files, function(path) file_path_sans_ext(basename(path)));

# files = dir(DATA.TESTS.CONSTRAINT, pattern="*.csv", full.names=TRUE);
# csvs.constraint = lapply(files, function(file) read.csv(file, header=TRUE));
# names(csvs.constraint) = lapply(files, function(path) file_path_sans_ext(basename(path)));

keller = read.csv(DATA.KELLER);
keller.points = keller$Points;
names(keller.points) = keller$Student
