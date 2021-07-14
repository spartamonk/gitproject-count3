import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [followers, setFollowers] = useState(mockFollowers)
  const [repos, setRepos] = useState(mockRepos)
  const [user, setUser] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({
    isError: false,
    errorMsg: '',
  })
  const [remainingRequests, setRemainingRequests] = useState(0)

  //handle error
  const toggleError = (isError = false, errorMsg = '') => {
    setError({
      isError,
      errorMsg,
    })
  }
  //check Requests
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`).then((response) => {
      let { remaining } = response.data.rate
      setRemainingRequests(remaining)
      if (remaining === 0) {
        toggleError(true, 'you have used all your hourly requests rate')
      }
    }).catch(error=> console.log(error))
  }
  useEffect(checkRequests, [])
  const handleChange = (e) => {
    setUser(e.target.value)
  }
  //fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    toggleError();
    const response = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    )
    if(response) {
      const {data} = response;
      setGithubUser(data);
      const { login, followers_url } = data;
      // axios(`${followers_url}?per_page=100`).then(response=> {
      //  setFollowers(response.data)
      // }).catch(error=>console.log(error));
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then(response=> {
      //   setRepos(response.data)
      // })
      await Promise.allSettled([
        axios(`${followers_url}?per_page=100`),
        axios(`${rootUrl}/users/${login}/repos?per_page=100`)
      ]).then(response=> {
        const [followers, repos] = response;
        const status = 'fulfilled';
        if(followers.status === status) {
         setFollowers(followers.value.data)
        }
        if(repos.status === status) {
          setRepos(repos.value.data)
        }
      }).catch(error=> console.log(error))
    } else {
      toggleError(true, 'There Is No User With That Username')
    }
    setIsLoading(false);
    checkRequests();
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    if(user) {
      fetchUsers();
    }
  }

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        followers,
        repos,
        user,
        isLoading,
        ...error,
        handleChange,
        handleSubmit,
        remainingRequests,
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

const useGlobalContext = () => {
  return React.useContext(GithubContext)
}

export { useGlobalContext, GithubProvider }
