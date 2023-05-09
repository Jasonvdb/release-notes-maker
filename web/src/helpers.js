const captilize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const point = (line) => {
    let split = line.split(':');
    split.shift(); //Remove fix:(wallet)
    line = split.join(':')
    return `* ${captilize(line.trim())}\n`;
};

export const sorter = (raw) => {
    const result = {
        fix: '',
        feat: '',
        ui: '',
        refactor: '',
        chore: '',
        docs: '',
        test: '',
        misc: '',
        full_changelog: '',
    };

    const lines = raw.split('\n');
    lines.forEach((line) => {
        if (line.trim() === '' || !line.startsWith('*')) return;
        if (line.toLowerCase().startsWith('* fix')) return result.fix += point(line);
        if (line.toLowerCase().startsWith('* feat')) return result.feat += point(line);
        if (line.toLowerCase().startsWith('* ui')) return result.ui += point(line);

        if (line.toLowerCase().startsWith('* refactor')) return result.refactor += point(line);
        if (line.toLowerCase().startsWith('* chore')) return result.chore += point(line);
        if (line.toLowerCase().startsWith('* docs')) return result.docs += point(line);
        if (line.toLowerCase().startsWith('* test')) return  result.test += point(line);
        if (line.toLowerCase().startsWith('**full changelog**')) return result.full_changelog = line;

        console.log(line);

        result.misc += point(line);
    });

    return result;
};

export const removeUnusedHeadingsAndNewLines = (raw) => {
    const lines = raw.split('\n');
    let result = [];
    lines.forEach((line, index) => {
        //Headings with no content below them
        if (line.startsWith('## ') && lines[index + 1].trim() === '') {
            return;
        }

        if (line.trim() === '' && lines[index + 1].trim() === '') {
            return;
        }

        result.push(line);
    });

    return result.join('\n');
};