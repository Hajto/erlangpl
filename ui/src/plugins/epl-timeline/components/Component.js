// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Highlight from 'react-highlight';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import List from 'react-virtualized/dist/commonjs/List';
import ArrowKeyStepper from 'react-virtualized/dist/commonjs/ArrowKeyStepper';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';

import { send } from '../../../sockets';
import * as actions from '../actions';

import 'highlight.js/styles/atom-one-dark.css';
import 'react-reflex/styles.css';
import './style.css';

class Component_ extends Component {
  header: any;
  state: {
    part1: string,
    part2: string
  };

  constructor(props) {
    super(props);
    this.state = {
      part1: '',
      part2: ''
    };
  }

  componentDidMount() {
    const pid = this.props.match.params.pid;
    if (pid) return this.props.setCurrentPid(pid);

    if (this.props.pid === null && this.props.timelines.length)
      return this.props.setCurrentPid(this.props.timelines[0].pid);
  }

  _selectCell = ({ scrollToRow }) => this.props.setCurrentMsg(scrollToRow);

  addPid(event: any) {
    if (event.which === 13) {
      const { state, props } = this;
      const pid = `<${props.pidPrefix}.${state.part1}.${state.part2}>`;
      send('epl_timeline_EPL', JSON.stringify(['add', pid]));
      this.props.pushTimelinePid(pid);
      this.setState({ part1: '', part2: '' });
    }
  }

  handlePidClick(pid: string) {
    this.props.setCurrentPid(pid);
  }

  handlePidRemove(pid: string) {
    send('epl_timeline_EPL', JSON.stringify(['remove', pid]));
    this.props.removePid(pid);
  }

  render() {
    const current = this.props.timelines.find(t => t.pid === this.props.pid);
    const currentTimeline = current ? current.timeline : [];
    const currentState = currentTimeline[this.props.msg];
    return (
      <div className="Timeline">
        <ul className="Dashboard-navigation nav nav-tabs">

          {this.props.timelines.map(({ pid, timeline }) => (
            <li
              key={pid}
              className={`nav-item ${pid === this.props.pid ? 'Dashboard-active' : ''}`}
              onClick={this.handlePidClick.bind(this, pid)}
            >
              <Link to={`/timeline/${pid}`}>
                <span className="badge">
                  {timeline.length < 1000 ? timeline.length : '999+'}
                </span>
                {pid}
                <i
                  className="fa fa-times"
                  onClick={() => this.handlePidRemove(pid)}
                />
              </Link>
            </li>
          ))}
          <li className="nav-item" style={{ paddingLeft: '5px' }}>
            {`<${this.props.pidPrefix}.`}
          </li>

          <li className="nav-item" style={{ width: '100px' }}>
            <input
              placeholder="first part"
              value={this.state.part1}
              onKeyDown={this.addPid.bind(this)}
              onChange={event => this.setState({ part1: event.target.value })}
            />
          </li>
          <li className="nav-item">{`.`}</li>
          <li className="nav-item" style={{ width: '100px' }}>
            <input
              placeholder="second part"
              value={this.state.part2}
              onKeyDown={this.addPid.bind(this)}
              onChange={event => this.setState({ part2: event.target.value })}
            />
          </li>
          <li className="nav-item">{`>`}</li>
        </ul>

        {currentState
          ? <div className="pane">
              <ReflexContainer orientation="vertical">

                <ReflexElement flex={0.25}>
                  <ArrowKeyStepper
                    className="messages"
                    columnCount={1}
                    mode="cells"
                    isControlled
                    scrollToRow={this.props.msg}
                    onScrollToChange={this._selectCell}
                    rowCount={currentTimeline.length}
                    children={({ onSectionRendered, scrollToRow }) => (
                      <AutoSizer>
                        {({ height, width }) => (
                          <List
                            onSectionRendered={onSectionRendered}
                            scrollToIndex={scrollToRow}
                            width={width}
                            height={height}
                            rowCount={currentTimeline.length}
                            rowHeight={35}
                            rowRenderer={({ index, key, style }) => {
                              const { message } = currentTimeline[index];
                              const className = `message ${index === scrollToRow ? 'active' : ''}`;

                              return (
                                <div
                                  style={style}
                                  key={key}
                                  className={className}
                                  onClick={() =>
                                    this.props.setCurrentMsg(index)}
                                >
                                  <span className="content">
                                    {message}
                                  </span>
                                  <span className="index">
                                    {index}
                                  </span>
                                </div>
                              );
                            }}
                          />
                        )}
                      </AutoSizer>
                    )}
                  />
                </ReflexElement>

                <ReflexSplitter />

                <ReflexElement flex={0.75}>
                  <div className="state">
                    <h3 ref={node => (this.header = node)}>
                      {currentTimeline[this.props.msg].message}
                    </h3>
                    <Highlight
                      className="erlang"
                      style={{
                        height: `calc(100% - ${this.header ? this.header.clientHeight : '0'}px)`
                      }}
                    >
                      {currentState.state}
                    </Highlight>
                  </div>
                </ReflexElement>
              </ReflexContainer>
            </div>
          : <div
              className="pane"
              style={{ textAlign: 'center', marginTop: '20px' }}
            >
              No changes tracked
            </div>}
      </div>
    );
  }
}

import { pushTimelinePid } from '../../epl-sup-tree/actions';

export default connect(
  state => ({
    timelines: state.eplTimeline.timelines,
    pid: state.eplTimeline.pid,
    msg: state.eplTimeline.msg,
    pidPrefix: state.eplTimeline.pidPrefix
  }),
  {
    removePid: actions.removePid,
    pushTimelinePid,
    setCurrentPid: actions.setCurrentPid,
    setCurrentMsg: actions.setCurrentMsg
  }
)(Component_);
