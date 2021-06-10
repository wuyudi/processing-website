import React, { memo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import { LocalizedLink as Link, useLocalization } from 'gatsby-theme-i18n';
import classnames from 'classnames';
import { useIntl } from 'react-intl';
import Img from 'gatsby-image';
import p5 from 'p5';

import Layout from '../../components/Layout';
import Content from '../../components/ContentWithSidebar';
import { SidebarTree } from '../../components/Sidebar';
import Tabs from '../../components/Tabs';
import { ExampleItem } from '../../components/examples/ExamplesList';

import { referencePath } from '../../utils/paths';
import { useTree, useSidebar } from '../../hooks';
import {
  useOrderedPdes,
  usePreparedExamples,
  useRelatedExamples
} from '../../hooks/examples';

import css from '../../styles/templates/examples/example.module.css';
import grid from '../../styles/grid.module.css';

// This is to make sure that p5.Vector and other namespaced classes
// work in the live sketch examples.
if (typeof window !== 'undefined') {
  window.p5 = p5;
}

const ExampleTemplate = ({ data, pageContext }) => {
  const [showSidebar, setShowSidebar] = useSidebar();
  const intl = useIntl();

  const { name, related } = pageContext;
  const { example, image, allExamples, relatedImages, liveSketch } = data;
  const json = example?.childJson;

  const pdes = useOrderedPdes(name, data.pdes.nodes);
  const examples = usePreparedExamples(allExamples.nodes, relatedImages.nodes);
  const tree = useTree(examples);
  const relatedExamples = useRelatedExamples(examples, related);

  // Run live sketch
  useEffect(() => {
    if (liveSketch && json) {
      let p5Instance;
      const tryToRunSketch = () => {
        if (window.runLiveSketch) {
          console.log('Live sketch: running');
          p5Instance = new p5(window.runLiveSketch, 'example-cover');
        } else {
          console.log('Live sketch: Not ready');
          setTimeout(tryToRunSketch, 50);
        }
      };
      setTimeout(tryToRunSketch, 500);
      return () => {
        if (p5Instance) {
          console.log('Live sketch: Removing');
          p5Instance.remove();
        }
      };
    }
  }, [liveSketch, json]);

  return (
    <Layout hasSidebar>
      <Helmet>
        {json?.title && <title>{json.title}</title>}
        {liveSketch && <script>{`${liveSketch.childRawCode.content}`}</script>}
      </Helmet>
      <div className={grid.grid}>
        <SidebarTree
          title={intl.formatMessage({ id: 'examples' })}
          tree={tree}
          setShow={setShowSidebar}
          show={showSidebar}
          useSerif
        />
        {json ? (
          <Content collapsed={!showSidebar}>
            <h1>{json.title}</h1>
            {json.author && (
              <h3>
                {intl.formatMessage({ id: 'by' })} {json.author}
              </h3>
            )}
            <div className={grid.grid}>
              <div className={classnames(grid.col, css.description)}>
                <p
                  dangerouslySetInnerHTML={{
                    __html: json.description
                  }}></p>
              </div>
              {json.featured.length > 0 && (
                <FeaturedFunctions
                  featured={json.featured}
                  heading={intl.formatMessage({ id: 'featured' })}
                />
              )}
            </div>
            <div className={css.cover} id="example-cover">
              {!liveSketch && image && (
                <Img fluid={image.childImageSharp.fluid} />
              )}
            </div>
            <Tabs pdes={pdes} className={css.tabs} />
            <RelatedExamples
              examples={relatedExamples}
              heading={intl.formatMessage({ id: 'relatedExamples' })}
            />
            <p className={classnames(css.note)}>
              {intl.formatMessage({ id: 'exampleInfo' })}
              <a
                href={
                  'https://github.com/processing/processing-docs/issues?state=open'
                }>
                {intl.formatMessage({ id: 'letUsKnow' })}
              </a>
              .
            </p>
          </Content>
        ) : (
          <Content collapsed={!showSidebar}>
            {intl.formatMessage({ id: 'notTranslated' })}
            <Link to={pageContext.slug}>
              {' '}
              {intl.formatMessage({ id: 'englishPage' })}
            </Link>
          </Content>
        )}
      </div>
    </Layout>
  );
};

const FeaturedFunctions = memo(({ heading, featured }) => {
  return (
    <div className={classnames(grid.col, css.featured)}>
      <h3>{heading}</h3>
      <ul>
        {featured.map((feature, key) => (
          <li key={`feature-${key}`}>
            <Link to={referencePath(feature)}>
              {feature.replace(/_$/, '()').replace(/_/g, ' ')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});

const RelatedExamples = memo(({ heading, examples }) => {
  const { locale } = useLocalization();
  return (
    <div>
      <h3>{heading}</h3>
      <ul className={grid.grid}>
        {examples.slice(0, 6).map((example, key) => (
          <ExampleItem
            node={example}
            locale={locale}
            key={`example-${example.name}`}
            variant="related"
          />
        ))}
      </ul>
    </div>
  );
});

export default ExampleTemplate;

export const query = graphql`
  query(
    $name: String!
    $relDir: String!
    $locale: String!
    $related: [String!]!
  ) {
    example: file(
      fields: { name: { eq: $name }, lang: { eq: $locale } }
      sourceInstanceName: { eq: "examples" }
    ) {
      relativeDirectory
      childJson {
        name
        title
        author
        description
        featured
      }
    }
    pdes: allFile(
      filter: {
        sourceInstanceName: { eq: "examples" }
        relativeDirectory: { eq: $relDir }
        extension: { regex: "/(pde)/" }
      }
    ) {
      nodes {
        name
        internal {
          content
        }
      }
    }
    image: file(
      relativeDirectory: { eq: $relDir }
      extension: { regex: "/(png)/" }
    ) {
      name
      relativeDirectory
      childImageSharp {
        fluid(maxWidth: 800) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    liveSketch: file(
      relativeDirectory: { eq: $relDir }
      name: { eq: "liveSketch" }
      extension: { regex: "/(js$)/" }
    ) {
      name
      childRawCode {
        content
      }
    }
    allExamples: allFile(
      filter: {
        sourceInstanceName: { eq: "examples" }
        fields: { lang: { eq: "en" } }
        extension: { eq: "json" }
        relativeDirectory: { regex: "/^((?!data).)*$/" }
      }
    ) {
      nodes {
        name
        relativeDirectory
        relativePath
        childJson {
          name
          title
        }
      }
    }
    relatedImages: allFile(
      filter: {
        name: { in: $related }
        sourceInstanceName: { eq: "examples" }
        extension: { regex: "/(jpg)|(jpeg)|(png)|(gif)/" }
        relativeDirectory: { regex: "/^((?!data).)*$/" }
      }
    ) {
      nodes {
        name
        relativeDirectory
        childImageSharp {
          fluid(maxWidth: 200) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  }
`;
