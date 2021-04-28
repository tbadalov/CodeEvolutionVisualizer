const React = require('react');
const Tooltip = require('../tooltip');
const tooltipWithGithubButtonStyle = require('../css/tooltip_with_github_button.css');

function TooltipWithGithubButton(props) {
  return(
    <Tooltip {...props}
      title={
        <div className='github-commit-title'>
          <p>{props.commitHash}</p>
          <a className='github-icon'
            title='Show this commit on GitHub'
            target='_blank'
            href={`${props.repositoryUrl}/commit/${props.commitHash}`}
          />
        </div>
      }
    />
  );
}

module.exports = TooltipWithGithubButton;
